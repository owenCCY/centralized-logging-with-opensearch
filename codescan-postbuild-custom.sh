#!/bin/bash
#--------------------------------------------------------------------
# Usage: this script must exit with a non-zero return code if the
# Viperlight scan fails.
#--------------------------------------------------------------------
. ./codescan-funcs.sh

echo ================================================================
echo ======     Viperlight Script `basename $0`
echo ================================================================
scan_id=0
source_dir='./source'
solution_dir=`pwd`
VIPERLIGHT_SCAN_STRATEGY=${VIPERLIGHT_SCAN_STRATEGY:-"Enforce"}
VIPERLIGHT_PUBCHECK_STRATEGY=${VIPERLIGHT_PUBCHECK_STRATEGY:-"Monitor"}
PIPELINE_TYPE=${PIPELINE_TYPE:-"feature"}

echo Viperlight Scan Strategy is ${VIPERLIGHT_SCAN_STRATEGY}
echo Viperlight PubCheck Strategy is ${VIPERLIGHT_PUBCHECK_STRATEGY}
echo Pipeline type is ${PIPELINE_TYPE}

# Create a temp folder for working data
viperlight_temp=/tmp/viperlight_scan # should work in most environments
if [ -d $viperlight_temp ]; then
    rm $viperlight_temp/*
    rmdir $viperlight_temp
fi
mkdir $viperlight_temp

export PATH=${PATH}:../viperlight/bin

failed_scans=0

run_viperlight() {
  type=$1
  strategy=$2
  scan_id=$((scan_id+1))
  output_file="${viperlight_temp}/viperlight_${type}_${scan_id}.txt"
  scan_command="viperlight ${type} $3 --outfile ${output_file}"
  $scan_command
  rc=$?
  if [ $rc -eq 0 ]; then
      echo SUCCESS
  elif [ $rc -eq 42 ]; then
      echo NOTHING TO SCAN
  else
      echo FAILED rc=$rc
      if [ ${strategy} == "Enforce" ]; then
          echo -e "SCAN FAILED\n" | cat - $output_file > tempfile && mv tempfile $output_file
          failed_scans=$((failed_scans+1))
      fi
      echo -e "\n=====================================================================================\n${scan_command}\nMODE: ${strategy}\n" | cat - $output_file > tempfile && mv tempfile $output_file
  fi
}

scan_npm() {
    echo -----------------------------------------------------------
    echo NPM Scanning ${1}
    echo -----------------------------------------------------------
    folder_path=`dirname $1`
    run_viperlight scan ${VIPERLIGHT_SCAN_STRATEGY} "-t $folder_path -m node-npmoutdated -m node-yarnoutdated"
}

scan_py() {
    echo -----------------------------------------------------------
    echo Python Scanning $1
    echo -----------------------------------------------------------
    folder_path=`dirname $1`
    run_viperlight scan ${VIPERLIGHT_SCAN_STRATEGY} "-t ${folder_path} -m notice-py"
}

echo -----------------------------------------------------------
echo Scanning all Nodejs projects
echo -----------------------------------------------------------
find_all_node_projects ${viperlight_temp}
if [[ -e ${viperlight_temp}/scan_npm_list.txt ]]; then
    while read folder
        do
            echo scan_npm $folder
        done < $viperlight_temp/scan_npm_list.txt
else
    echo No node projects found
fi

echo -----------------------------------------------------------
echo Set up python virtual environment for pubcheck scan
echo -----------------------------------------------------------
tear_down_python_virtual_env ../
# Create a list of python folders in ${viperlight_temp}/scan_python_lists.txt
find_all_python_requirements ${viperlight_temp}
setup_python_virtual_env ../

# Install modules
if [[ -e ${viperlight_temp}/scan_python_list.txt ]]; then
    pip install bandit pip-licenses pip-audit -U
    while read folder
        do
            pip install -r $folder
        done < $viperlight_temp/scan_python_list.txt
else
    echo No python projects found
fi

echo -----------------------------------------------------------
echo Running publisher checks
echo -----------------------------------------------------------
run_viperlight pubcheck ${VIPERLIGHT_PUBCHECK_STRATEGY} ""

report_banner
exec 2> /dev/null
cat $viperlight_temp/viperlight_scan*.txt
cat $viperlight_temp/viperlight_pubcheck*.txt

if [ ${failed_scans} == 0 ]
then
    echo -e "\n\nScan completed successfully"
else
    echo -e "\n\n${failed_scans} scans failed. Check previous messages for findings."
fi

exit ${failed_scans}
